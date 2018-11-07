# Helper functions related to the networks module
# color_palette <- makeDescriptionPalette(phecode_info)
# takes a subset of the individual data along with phewas results
# and returns a set of network data in the form of edges and vertices
# as required by network3d
#' Convert phenotype dataframe to a data list that works with network plotting functions
#'
#'
#' @param data A phenome dataframe with phecodes as columns and also with an IID column and a snp status column
#' @param phecode_info Information about each codes results in phewas study in form of columns: code, category, tooltip.
#' @param inverted_codes An array of codes that are inverted.
#' @param color_palette Dataframe with columns of phecode description (category) and a mapped a color for node coloring.
#' @param case_size Size of nodes drawn for cases (default of 0.1)
#' @param code_size Size of nodes drawn for phecodes (default of 0.3)
#' @param no_copies Color of cases nodes with no minor allele copy (default grey)
#' @param one_copy Color of cases nodes with one minor allele copy (default orangered)
#' @param two_copies Color of cases nodes with two minor allele copies (default redish)
#'
#' @return A list of edges and vertices with attributes used by the various network plotting functions included in library
#' @export
#'
#' @examples
makeNetworkData <- function(
  data,
  phecode_info,
  inverted_codes,
  color_palette,
  case_size = 0.1,
  code_size = 0.3,
  no_copies = '#bdbdbd',
  one_copy = 'orangered',
  two_copies = 'red'
){

  # get rid of superfluous columns so we just have phenotypes
  data_small <- data %>%
    dplyr::select(-IID, -snp)

  n_phenos <- data_small %>% ncol()
  n_cases <- data_small %>% nrow()

  pheno_names <- colnames(data_small)
  case_names <- paste('case', 1:n_cases)

  code_to_color <- dplyr::mutate(
    phecode_info,
    inverted = code %in% inverted_codes
  ) %>%
    dplyr::select(code, category, tooltip, inverted) %>%
    dplyr::filter(code %in% pheno_names) %>%
    dplyr::inner_join(color_palette %>% mutate(description = as.character(description)), by = c('category' = 'description')) %>%
    dplyr::select(name = code, color, tooltip, inverted)

  vertices <- data_frame(
    index = 1:(n_cases + n_phenos),
    snp_status = c(data$snp, rep(0, n_phenos)),
    name = c(case_names, pheno_names)
  ) %>%
    dplyr::left_join(code_to_color, by = 'name') %>%
    dplyr::mutate(
      color = dplyr::case_when(
        snp_status == 1 ~ one_copy,
        snp_status == 2 ~ two_copies,
        is.na(color) ~ no_copies,
        TRUE ~ color
      ),
      size = ifelse(stringr::str_detect(name, 'case'), case_size, code_size),
      selectable = !stringr::str_detect(name, 'case'),
      id = index
    )

  colnames(data_small) <- (n_cases + 1):(n_cases + n_phenos)

  edges <- data_small %>%
    dplyr::mutate(case = as.character(1:n())) %>%
    tidyr::gather(code, connected, -case) %>%
    dplyr::filter(connected == 1) %>%
    dplyr::select(-connected, source = case, target = code)


  list(
    edges = edges,
    vertices = vertices
  )
}
