#' Gather snp annotation information
#'
#' Passed a snp rsid or name from the Illumina exome chip, this function returns
#' a list of pertinant annotations for the user.
#'
#' @param snp_id Rsid or name for the SNP
#'
#' @return A two column tibble containing a series of annotation-value pairs for
#'   snp.
#'
#' @examples
#' gather_snp_annotations('rs34051416')
#' @export
gather_snp_annotations <- function(snp_id){

  dplyr::filter(meToolkit::snp_annotations,
                rsid == snp_id | name == snp_id) %>%
    tidyr::gather() %>%
    dplyr::filter(!is.na(value)) %>%
    dplyr::mutate(key = stringr::str_replace_all(key, '_', ' '))

}
