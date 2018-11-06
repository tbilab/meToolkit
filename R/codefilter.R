
#' Filter codes.
#'
#' @param type Character of 'delete' or 'isolate' deciding which type of filtering is desired
#' @param code_list Character vector containing code ids that need to be filtered
#' @param current_codes Dataframe with currently selected codes that will be filtered.
#'
#' @return Filtered currently selected codes dataframe.
#' @export
#'
#' @examples
#' codeFilter('inver', c('001.00', '002.00'), myCurrentCodes)
codeFilter <- function(type, code_list, current_codes){

  included_codes <- current_codes

  if(type == 'delete'){
    included_codes <- meToolkit::deleteCodes(code_list, current_codes)
  }

  if(type == 'isolate'){
    included_codes <- meToolkit::isolateCodes(code_list, current_codes)
  }

  included_codes
}
