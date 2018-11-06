#' Delete Phecodes from a selected phecodes list with warning.
#'
#' @param codes_to_delete Character vector of codes to delete
#' @param current_codes Dataframe containing currently viewed codes with column \code{code} corresponding to the phecode id.
#'
#' @return Filtered currently viewing codes dataframe.
#' @export
#'
#' @examples
#' deleteCodes(c('001.00', '002.00'), myCurrentCodes)
deleteCodes <- function(codes_to_delete, current_codes){

  # Generate a new list of codes that we want to look at.
  new_included <- current_codes %>%
    dplyr::filter(!(code %in% codes_to_delete))

  if(nrow(new_included) < 2){
    meToolkit::warnAboutSelection()
    return(current_codes)
  }

  new_included
}
