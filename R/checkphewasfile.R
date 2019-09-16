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

  required_columns <- c('code', 'p_val', 'OR', 'description', 'category')

  missing_columns <- required_columns[!(required_columns %in% colnames(phewas))]

  num_missing <- length(missing_columns)
  if (num_missing == 1) {
    stop(paste('Missing', missing_columns, 'column.'), call. = FALSE)
  } else if (num_missing > 1) {
    missing_columns[num_missing] <- paste('and',  missing_columns[num_missing])
    stop(paste0('Missing columns ', paste(missing_columns, collapse = ', '), '.'), call. = FALSE)
  }

  phewas
}
