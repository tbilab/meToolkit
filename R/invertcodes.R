#' Invert currently selected codes
#'     Only inverts codes that were not preivously inverted. If a code is 'inverted' after it's already
#'     inverted it simple reverts back to normal.
#'
#' @param codes_to_invert Character vector of codes you wish to invert
#' @param currently_inverted_codes Currently selected dataframe with column \code{code} upon which to invert.
#'
#' @return Updated currently selected codes dataframe with previously requested codes inverted from their previous state.
#' @export
#'
#' @examples
#' invertCodes(c('001.00', '002.00'), myCurrentCodes)
invertCodes <- function(codes_to_invert, currently_inverted_codes){

  # codes that have been inverted and are now being reverted to normal
  already_inverted_codes <- intersect(currently_inverted_codes, codes_to_invert)

  # codes that are being freshly inverted
  newly_inverted_codes <- codes_to_invert[!(codes_to_invert %in% already_inverted_codes)]

  # codes that are unchanged/ stay inverted
  unchanged_codes <- currently_inverted_codes[!(currently_inverted_codes %in% already_inverted_codes)]

  # return the list of codes that should be inverted
  c(newly_inverted_codes, unchanged_codes)
}
