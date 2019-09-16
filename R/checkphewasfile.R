#' Check uploaded phewas file for correctness
#'
#' @param phewas Dataframe from uploaded phewas csv
#'
#' @return Supplied dataframe with a tooltip column added if it wasn't
#'   originally present.
#' @export
#'
#' @examples
#' checkPhewasFile('uploadedPhewasFile')
checkPhewasFile <- function(phewas){

  columns <- colnames(phewas)

  has_code <- 'code' %in% columns
  if(!has_code) stop("Missing Code column.", call. = FALSE)

  has_category <- 'category' %in% columns
  if(!has_category) stop("Missing Category column", call. = FALSE)

  has_pval <- 'p_val' %in% columns
  if(!has_pval) stop("Missing P Value column (p_val)", call. = FALSE)

  phewas
}
