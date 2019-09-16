#' Merge a tidy phenome dataframe with a tidy genome(single snp) genome
#' dataframe.
#'
#' @param phenome_data Dataframe with columns \code{IID} and \code{code}
#'   corresponding to all pairs of case and phenotypes
#' @param genome_data Dataframe with columns \code{IID} and \code{snp}
#'   corresponding to all pairs of case and snp MA status for a given individual
#'   snp
#'
#' @return A wide dataframe with columns \code{IID}, \code{snp}, and all the
#'   unique phecodes.
#' @export
#'
#' @examples
#' margePhenomeGenome(tidyPhenome, tidyGenome)
mergePhenomeGenome <- function(phenome_data, genome_data){
  phenome_data %>%
    dplyr::mutate(value = 1) %>%
    tidyr::spread(code, value, fill = 0) %>%
    dplyr::left_join(genome_data, by = 'IID') %>%
    dplyr::mutate(snp = ifelse(is.na(snp), 0, snp))
}
