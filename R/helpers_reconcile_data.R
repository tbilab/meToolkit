#' Combine and reconcile the three main data components needed for ME app and
#' return in app-friendly format
#'
#' Helper function used at the begining of a ME app that takes the raw format of
#' the three data sets required, phewas results, individual snp copies, and
#' individual phenotype pairs, and combines them into a list object that
#' combines individual data and checks phewas results along with extracting the
#' snp name from the column of the genotype file.
#'
#' @param phewas_results Dataframe containing the results of the phewas study.
#'   Needs columns \code{p_val}, \code{id}, \code{category}(along with
#'   accompanying \code{color}), \code{tooltip}.
#' @param id_to_snp Dataframe containing columns on \code{id}, \code{snp}(#
#'   copies of allele).
#' @param id_to_code Dataframe containing column \code{id}, and columns for each
#'   code included.
#' @param multiple_comparisons_adjustment What type of multiple comparisons
#'   adjustment should be done to the phewas results? Options include "None",
#'   "Bonferroni", and "Benjamini-Hochberg". Note that the correction is
#'   performed _before_ filtering of codes to those contained in individual
#'   data. Aka for as many tests as were passed in raw phewas results. If
#'   different behavior is desired, the user must provide results pre-adjusted.
#'
#' @return List with `snp_name`, `individual_data`, and `phewas_results`
#'   properties for use in ME app.
#'
#' @examples
#' reconcile_data(phewas_table, id_to_snp, phenotype_id_pairs)
reconcile_data <- function(phewas_results, id_to_snp, id_to_code, multiple_comparisons_adjustment) {

  phewas_checked <- check_phewas_file(phewas_results)
  id_to_snp_checked <- check_genome_file(id_to_snp)
  id_to_code_checked <- check_phenome_file(id_to_code)

  # first spread the phenome data to a wide format
  individual_data <- id_to_code_checked %>%
    dplyr::mutate(value = 1) %>%
    tidyr::spread(code, value, fill = 0) %>%
    dplyr::left_join(id_to_snp_checked$data, by = 'id') %>%
    dplyr::mutate(snp = ifelse(is.na(snp), 0, snp))

  # These are codes that are not shared between the phewas and phenome data. We will remove them
  phenome_cols <- colnames(individual_data)

  codes_in_phenome <- phenome_cols %>% head(-1) %>% tail(-1)
  codes_in_phewas <- unique(phewas_checked$code)

  in_phewas_not_in_phenome <- setdiff(codes_in_phewas, codes_in_phenome)
  in_phenome_not_in_phewas <- setdiff(codes_in_phenome, codes_in_phewas)

  total_mismatched <- length(in_phewas_not_in_phenome) + length(in_phenome_not_in_phewas)

  # Adjust p-value if requested
  if (multiple_comparisons_adjustment != "none") {
    phewas_checked <- dplyr::mutate(phewas_checked,
                                    p_val = p.adjust(p_val, method = multiple_comparisons_adjustment))
  }


  # remove bad codes from phewas and individual data if needed
  if (total_mismatched > 0) {
    warning(
      glue::glue(
        '{total_mismatched} codes removed from data due to mismatch between individual data and phewas results.'
      )
    )
    phewas_checked <- dplyr::filter(phewas_checked,!(code %in% in_phewas_not_in_phenome))
    individual_data <- individual_data[, !(phenome_cols %in% in_phenome_not_in_phewas)]
  }

  # The rest of the package is built on the assumption of
  # the ID column being IID so here we sub it in for the validated data's id.
  list(
    snp_name = id_to_snp_checked$snp_name,
    individual_data = individual_data %>% dplyr::rename(IID = id),
    phewas_results = phewas_checked
  )
}
