# Helper functions related to the networks module
# takes a subset of the individual data along with phewas results
# and returns a set of network data in the form of edges and vertices
# as required by network3d
#' Convert phenotype dataframe to a data list that works with network plotting functions
#'
#'
#' @param data A phenome dataframe with phecodes as columns and also with an \code{IID} column and a \code{snp} status column
#' @param phecode_info Information about each codes results in phewas study in form of columns: \code{code}, \code{category}, \code{color}, \code{tooltip}.
#' @param inverted_codes An array of codes that are inverted. Note that if a code is inverted that should also be reflected in \code{data}. This is only for visual modifications.
#' @param case_size Size of nodes drawn for cases (default of 0.1)
#' @param code_size Size of nodes drawn for phecodes (default of 0.3)
#' @param no_copies Color of cases nodes with no minor allele copy (default grey)
#' @param one_copy Color of cases nodes with one minor allele copy (default orangered)
#' @param two_copies Color of cases nodes with two minor allele copies (default redish)
#'
#' @return A list containing two dataframes:
#' \code{vertices} a dataframe containing each unique node in network (all unique IIDs and Phecodes) along with columns
#' \code{snp_status}, \code{name}, \code{color}, \code{size}, \code{selectable}, \code{id}, \code{tooltip} which are all attributes used by the various network plotting functions included in library
#' \code{edges}: a dataframe with columns \code{source} and \code{target} corresponding to the edges between each vertices according to the assigned interger \code{id}.
#' @export
#'
#' @examples
#' makeNetworkData(data, phewas_results)
makeNetworkData <- function(
  data,
  phecode_info,
  inverted_codes = c(),
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

  code_to_color <- phecode_info %>%
    # Throw away phecodes not seen in our data
    dplyr::filter(code %in% pheno_names) %>%
    # Add column for code inversion status
    dplyr::mutate( inverted = code %in% inverted_codes ) %>%
    dplyr::rename(name = code)

  vertices <- data_frame(
    # Integer index for keeping track of edges source and destinations
    index = 1:(n_cases + n_phenos),
    # How many snp allele copies for each case, 0s for phenotypes for obvious reasons
    snp_status = c(data$snp, rep(0, n_phenos)),
    # User-facing names of each node
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
    dplyr::transmute(source = as.numeric(case), target = as.numeric(code))

  list(
    edges = edges,
    vertices = vertices
  )
}
