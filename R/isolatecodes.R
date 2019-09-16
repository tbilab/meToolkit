#' Isolate currently viewed codes
#'
#' @param codes_to_isolate Character vector of codes ids to isolate
#' @param current_codes Dataframe with column \code{code} which will be filtered
#'   to just rows for requested codes.
#'
#' @return Filtered current codes dataframe.
#' @export
#'
#' @examples
#' isolateCodes(c('001.00', '002.00'), myCurrentCodes)
isolateCodes <- function(codes_to_isolate, current_codes){
  if(length(codes_to_isolate) < 2){

    meToolkit::warnAboutSelection()
    return(current_codes)
  }

  current_codes %>%
    dplyr::filter(code %in% codes_to_isolate)
}
