#' Check uploaded phenome file for correctness
#'
#' @param phenome Uploaded dataframe containing phenotype info
#'
#' @return Dataframe if no errors are thrown.
#' @export
#'
#' @examples
#' checkPhenomeFile(uploadedPhenomeFile)
checkPhenomeFile <- function(phenome){

  # should have two columns: one with title IID and one with title code.
  columns <- colnames(phenome)

  has_IID <- 'IID' %in% columns
  if(!has_IID) stop("Missing IID column.", call. = FALSE)

  has_code <- 'code' %in% columns
  if(!has_code) stop("Missing Code column.", call. = FALSE)

  phenome
}
