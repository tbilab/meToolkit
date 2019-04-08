#' Create a tooltip column for a phewas results dataframe.
#'
#' @param phewas dataframe containing a series of columns that will get concatinated into a single chunk of html with column name followed by the value.
#'
#' @return dataframe with an added tooltip column.
#' @export
#'
#' @examples
#' myPhewasResults %>% makeTooltips()
makeTooltips <- function(phewas){

  columns <- colnames(phewas)

  phewas <- dplyr::mutate(phewas, tooltip = '')

  for(col in columns){
    phewas <- dplyr::mutate(
        phewas,
        tooltip = paste0(
          tooltip,
          "<i> ", col, " </i>", !! rlang::sym(col), "</br>"
        )
      )
  }
  phewas
}
