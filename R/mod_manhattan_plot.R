#' UI function of manhattan plot module. This module produces a typical manhattan plot with interactive code selection
#'
#' @param id String with unique id of module in app
#' @return UI component of interactive manhattan plot
#' @export
#'
#' @examples
#' manhattan_plot_UI('my_mod')
manhattan_plot_UI <- function(id) {
  ns <- NS(id)
  tagList(
    div(
      plotly::plotlyOutput(ns("manhattanPlot"), height = '100%')
    )
  )
}
#' Server function of manhattan plot module. Returns a reactive variable that dispenses interaction events in the common type, payload format of \code{meToolkit} modules.
#'
#' @param input,output,session Auto-filled by callModule | ignore
#' @param results_data Dataframe containing the results of the phewas study. Needs columns \code{p_val}, \code{id}, \code{category}, \code{tooltip}.
#' @param selected_codes A reactive variable containing array of code \code{id}s that are currently selected in the app.
#' @return Server component of interactive manhattan plot
#' @export
#'
#' @examples
#' callModule(manhattan_plot, selected_codes, app_state$currently_selected, 'my_mod')
manhattan_plot <- function(
  input, output, session,
  results_data,
  selected_codes ) {

}
