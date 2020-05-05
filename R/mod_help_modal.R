#' Help Modal UI
#'
#' @param id Unique id of module
#' @param title Header text for help modal
#' @param help_img_url Location of the helper image for modal
#' @param more_link Link to further information about context
#'
#' @return NULL
#' @export
help_modal_UI <- function(id, title, help_img_url, more_link) {

  ns <- NS(id)

  modal_class <-
  shiny::tagList(
    shiny::actionButton(ns('open_help'), class = "title-bar-help-btn", label = "?"),
    shiny::div(
      id = ns('modal'),
      class = "help_page hidden",
      shiny::h1(title),
      shiny::div(shiny::img(src = help_img_url)),
      shiny::actionButton(ns("close_help"), label = "Close"),
      shiny::a(href = more_link, style="padding-left: 2rem;", "See here for more information")
    )
  )
}

#' Help Modal Server
#'
#' @param input,output,session Auto-filled by `callModule` | ignore
#'
#' @return NULL
#' @export
help_modal <- function(input,
                       output,
                       session) {
  observeEvent(input$open_help, {
    session$sendCustomMessage("show_help_modal", session$ns("modal"))
  })

  observeEvent(input$close_help, {
    session$sendCustomMessage("hide_help_modal", session$ns("modal"))
  })
}
