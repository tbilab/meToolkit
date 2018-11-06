#' Warn user about bad selection
#'
#' @return A popup modal that warns the user they made a bad selection (too few codes) and asks them to do it again
#' @export
#'
#' @examples
#' warnAboutSelection()
warnAboutSelection <- function(){

  shiny::showModal(modalDialog(
    title = "Too many codes removed",
    "You need to leave at least two codes for the app to visualize. Try adding some codes back.",
    easyClose = TRUE
  ))
}
