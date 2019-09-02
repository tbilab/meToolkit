#' Interactive manhattan plot and table for selecting codes for further visualization in app.
#'
#' @param id String with unique id of module in app
#' @param height How tall we want this module to be in pixels (defaults to `NULL`). If not provided the div must be styled to have a height using css. (See `div_class` argument for targeting.)
#' @param div_class A character string containing a class name for the entire plot to be wrapped in. This can then be used to style with external css. Defaults to 'manhattan_plot'.
#' @return UI component of interactive manhattan plot
#' @export
#'
#' @examples
#' manhattan_plot_and_table_UI('my_mod')
manhattan_plot_and_table_UI <- function(id, height = NULL, div_class = 'manhattan_plot') {
  ns <- NS(id)

  wrapper_height <- ''
  if(!is.null(height)){
    wrapper_height <- glue::glue('height: {height}px')
  }
  tagList(
    r2d3::d3Output(ns('plot'), height = '100%')
  )
}

#' Server function of manhattan plot module. Returns a reactive variable that dispenses interaction events in the common type, payload format of \code{meToolkit} modules.
#'
#' @param input,output,session Auto-filled by callModule | ignore
#' @param results_data Dataframe containing the results of the phewas study. Needs columns \code{p_val}, \code{id}, \code{category}(along with accompanying \code{color}), \code{tooltip}.
#' @param selected_codes A reactive variable containing array of code \code{id}s that are currently selected in the app.
#' @param colors A list of CSS-valid colors to paint interface in. Needs \code{light_grey, med_grey, dark_grey, light_blue}.
#' @param action_object A \code{reactiveVal} that will be updated by the module upon selection
#' @return Server component of interactive manhattan plot. Returns type-payload list with the type \code{"selection"} to the passed \code{action_object} for updating app state.
#' @export
#'
#' @examples
#' callModule(manhattan_plot_and_table,  'my_mod', selected_codes, app_state$currently_selected)
manhattan_plot_and_table <- function(
  input, output, session,
  results_data,
  selected_codes,
  colors,
  action_object ) {

  # send data and options to the 2d plot
  output$plot <- r2d3::renderD3({

    r2d3::r2d3(
      data = results_data,
      script = system.file("d3/manhattan_plot/manhattan_plot.js", package = "meToolkit"),
      container = 'div',
      dependencies = c(
        "d3-jetpack",
        system.file("d3/helpers.js", package = "meToolkit"),
        system.file("d3/manhattan_plot/phewas_table.js", package = "meToolkit")
      ),
      css = c(
        system.file("d3/helpers.css", package = "meToolkit"),
        system.file("d3/manhattan_plot/manhattan_plot.css", package = "meToolkit"),
        system.file("css/buttons.css", package = "meToolkit")
      ),
      options = list(
        msg_loc = session$ns('message'),
        selected = selected_codes(),
        colors = colors
      )
    )
  })

  # If we've received a message, package it into the returned reactive value
  observeEvent(input$message, {
    validate(need(input$message, message = FALSE))
    action_object(input$message)
  })

}
