#' Detect Id column in data
#'
#' Takes input data and makes sure that an id column has been provided in proper
#' format. Used to validate data using \code{\link{checkGenome}}, and
#' \code{\link{checkPhenome}}.
#'
#' @seealso \code{\link{checkGenome}}, \code{\link{checkPhenome}}
#' @param data Dataframe that should have id column
#' @param possible_id_cols List of possible columns that are acceptable ids.
#' @param final_id_name Name of final column that is returned if no errors are
#'   detected.
#'
#' @return Dataframe with a column with name `final_id_name` contained,
#'
#' @examples
#' dplyr::tibble(
#'   grid = c('a', 'b', 'c'),
#'   snp = c(1, 2, 3)
#' ) %>% detect_id_column()
#'
#' @export
detect_id_column <- function(data, possible_id_cols = c('iid', 'id', 'grid'), final_id_name = 'id'){

  # Get boolean of columns that match id options
  is_id_col <- colnames(data) %in% possible_id_cols

  # Do any match columns?
  has_id_col <- any(is_id_col)

  if(!has_id_col){
    stop(
      paste(
        "Missing id column. Make sure your data has a column with one of the following names:",
        paste(possible_id_cols, collapse = ', ')
      ),
      call. = FALSE
    )
  }

  # Which column matches id?
  id_col_loc <- which(is_id_col)

  if(length(id_col_loc) > 1){
    stop(
      paste(
        "Multiple id columns in data. Make sure to only include",
        "one column with a name in the following list:",
        paste(possible_id_cols, collapse = ', ')
      ),
      call. = FALSE
    )
  }

  # Set the id column to standard value
  colnames(data)[id_col_loc] <- final_id_name

  data
}
