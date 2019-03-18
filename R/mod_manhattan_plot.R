#' UI function of manhattan plot module. This module produces a typical manhattan plot with interactive code selection
#'
#' @param id String with unique id of module in app
#' @return HTML component of shiny module
#' @export
#'
#' @examples
#' manhattan_plot_UI('my_mod')
manhattan_plot_UI <- function(id) {
  ns <- NS(id)
  tagList(

  )
}
#' Server function of manhattan plot module. Returns a reactive variable that dispenses interaction events in the common type, payload format of \code{meToolkit} modules.
#'
#' @param input,output,session Auto-filled by callModule | ignore
#' @return Shiny module
#' @export
#'
#' @examples
#' callModule(manhattan_plot, 'my_mod')
manhattan_plot <- function(input, output, session) {

}
