#' Check uploaded phenome file for correctness
#'
#' This function will lowercase all columns.
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
  colnames(phenome) <-  tolower(colnames(phenome))

  # Make sure ID column is in and in the format we want.
  phenome <- meToolkit::detect_id_column(phenome)

  has_code <- 'code' %in% colnames(phenome)
  if(!has_code) stop("Missing Code column.", call. = FALSE)

  phenome
}
