#' Grab snp info from NCBI database
#'    Grabs basic info on a snp from the NCBI for display in the info panel
#' @param snp rsid string of the snp of interest.
#'
#' @return list with values of chromosome, gene, major allele, minor allele, MAF, and base-pair location.
#' @export
#'
#' @examples
#' getSNPInf('rs13283456')
getSNPInfo <- function(snp){
  results <- rsnps::ncbi_snp_query(snp)
  list(
    chromosome = results$Chromosome,
    gene = results$Gene,
    major_allele = results$Major,
    minor_allele = results$Minor,
    MAF = results$MAF,
    loc = results$BP
  )
}
