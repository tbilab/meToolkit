#' Use reveal_element function
#' Function to be included in UI of shiny app that uses \code{reveal_element()} function. Injects javascript into HTML.
#' @return Injected javascript function in head of HTML that Shiny uses to reveal elements.
#' @export
#'
#' @examples
#' shiny::tagList(use_reveal_element(),h1('Hi there', id = 'hi_message', class = 'hidden'))
use_reveal_element <- function(){
  shiny::tags$head(
    shiny::tags$script("
      Shiny.addCustomMessageHandler('show_element', function(target){
        document.getElementById(target).classList.remove('hidden');
        document.getElementById(target).classList.add('show');
      });"
    ),
    shiny::tags$style("
      .show { transition: opacity 500ms;}
      .hidden { opacity: 0; }"
    )
  )
}

#' Reveal hidden element
#' Targets a given UI element and toggles it from hidden to visable.
#' @param session The session variable from your server or module function.
#' @param target_id Unique character string of the id if your element to be revealed.
#'
#' @return
#' @export
#'
#' @examples
#' reveal_element(session, 'hi_message')
reveal_element <- function(session, target_id){
    session$sendCustomMessage("show_element",  target_id)
}
