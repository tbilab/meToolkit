#' Gather snp annotation information
#'
#' Passed a snp rsid or name from the Illumina exome chip, this function returns
#' a list of pertinant annotations for the user.
#'
#' @param snp_id Rsid or name for the SNP
#'
#' @return Two column tibble containing a series of annotation-value pairs for
#'   snp.
#'
#' @examples
#' gather_snp_annotations('rs34051416')
#' @export
gather_snp_annotations <- function(snp_id) {
  snp_info <- dplyr::filter(meToolkit::snp_annotations,
                            rsid == snp_id | name == snp_id)

  if (nrow(snp_info) == 0) {
    # If we couldn't find anything for this snp just return null
    return( NULL )
  } else {
    return(
      snp_info %>%
        tidyr::gather() %>%
        dplyr::filter(!is.na(value)) %>%
        dplyr::mutate(key = stringr::str_replace_all(key, '_', ' '))
    )
  }
}
