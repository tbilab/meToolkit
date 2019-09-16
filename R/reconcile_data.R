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
#' @param genotypes Dataframe containing columns on \code{IID}, \code{snp}(#
#'   copies of allele).
#' @param phenotypes Dataframe containing column  \code{IID}, and columns for
#'   each code included.
#'
#' @return List with `snp_name`, `individual_data`, and `phewas_results`
#'   properties for use in ME app.
#'
#' @examples
#' reconcile_data(phewas_table, id_to_snp, phenotype_id_pairs)
#' @export
reconcile_data <- function(phewas_results, genotypes, phenotypes) {

  phewas_checked <- meToolkit::checkPhewasFile(phewas_results)
  genotypes_checked <- meToolkit::checkGenomeFile(genotypes)
  phenotypes_checked <- meToolkit::checkPhenomeFile(phenotypes)

  # first spread the phenome data to a wide format
  individual_data <- meToolkit::mergePhenomeGenome(phenotypes_checked, genotypes_checked$data)

  # These are codes that are not shared between the phewas and phenome data. We will remove them
  phenome_cols <- colnames(individual_data)
  bad_codes <- setdiff(phenome_cols %>% head(-1) %>% tail(-1),
                       unique(phewas_checked$code))

  # remove bad codes from phewas and individual data if needed
  if (length(bad_codes) > 0) {
    warning(
      glue::glue(
        '{length(bad_codes)} codes removed from data due to mismatch between individual data and phewas results.'
      )
    )
    phewas_checked <- dplyr::filter(phewas_checked,!(code %in% bad_codes))
    individual_data <- individual_data[, -individual_data(phenome_cols %in% bad_codes)]
  }

  list(
    snp_name = genotypes_checked$snp_name,
    individual_data = individual_data,
    phewas_results = phewas_checked
  )
}
