#' Use pretty popup function
#' Function to be included in UI of shiny app that uses \code{pretty_popup()} function. Injects javascript into HTML.
#' @return Injected javascript function in head of HTML that Shiny uses to send popup messages to browser.
#' @export
#'
#' @examples
#' shiny::tagList(use_pretty_popup(),h1('Hi there'))
use_pretty_popup <- function(){
  shiny::tags$head(
    shiny::tags$script(
      glue::glue("
        Shiny.addCustomMessageHandler('load_popup', function(message){
          swal(message);
        });", .open = "[", .close = "]")
    )
  )
}

#' Reveal hidden element
#' Targets a given UI element and toggles it from hidden to visable.
#' @param session The session variable from your server or module function.
#' @param title Character string containing the main title of popup.
#' @param body Character string containing the body of popup message.
#'
#' @return A popup over the main UI of your shiny app with desired message.
#' @export
#'
#' @examples
#' pretty_popup(session, "Oh no", 'You got an error. It was probably because of X,Y, and Z.')
pretty_popup <- function(session, title, body){
  session$sendCustomMessage(
    "load_popup",
    list(title = title, text = body)
  )
}
