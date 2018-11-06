#' Merge a wide phenome file and a tidy snp file by IID and desired snp.
#'
#' @param SNP String of desired snp rsid as its encoded in the \code{snp} column of your \code{snp_data} dataframe.
#' @param phenome_data Wide phenome dataframe with an \code{IID} column.
#' @param snp_data Tidy snp dataframe with \code{IID}, \code{snp}, and \code{copies} columns corresponding to the case ID, snp id, and copies of snp minor allele respectively.
#'
#' @return A wide dataset with columns for case \code{IID}, all the phenotypes, and \code{snp} column corresponding to number of minor allele copies of snp of interest each case has.
#' @export
#'
#' @examples
#' mergePhenomeSnp('rs9392013', widePhenome, tidySNP)
mergePhenomeSnp <- function(SNP, phenome_data, snp_data){

  phenome_data %>%
    dplyr::inner_join(
      snp_data %>%
        dplyr::filter(snp == SNP) %>%
        dplyr::select(IID, snp = copies),
      by = 'IID')
}
