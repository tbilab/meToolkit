#' Normalize a phecode vector to padded character
#'
#' Across ME we work with the phecodes that are provided in a million different
#' formats. This takes any format (float, string) and converts it to a 0-padded
#' character.
#'
#' @param codes A vector of phecodes in whatever format your heart desires. E.g. `8.00`, `8`, `0008.0`, ...
#'
#' @return A vector of 0-padded phecodes.
#' @export
#'
#' @examples
#' normalizePhecode(c(8, 8.1, 9.2))
normalizePhecode <- function(codes){

  stringr::str_pad(
    sprintf('%3.2f', as.numeric(codes)),
    width = 6,
    side = "left",
    pad = "0"
  )

}
