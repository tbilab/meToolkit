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
    plotly::plotlyOutput(ns("manhattanPlot"), height = '100%')
  )
}
#' Server function of manhattan plot module. Returns a reactive variable that dispenses interaction events in the common type, payload format of \code{meToolkit} modules.
#'
#' @param input,output,session Auto-filled by callModule | ignore
#' @param results_data Dataframe containing the results of the phewas study. Needs columns \code{p_val}, \code{id}, \code{category}(along with accompanying \code{color}), \code{tooltip}.
#' @param selected_codes A reactive variable containing array of code \code{id}s that are currently selected in the app.
#' @param action_object A \code{reactiveVal} that will be updated by the module upon selection
#' @return Server component of interactive manhattan plot. Returns type-payload list with the type \code{"selection"} to the passed \code{action_object} for updating app state.
#' @export
#'
#' @examples
#' callModule(manhattan_plot,  'my_mod', selected_codes, app_state$currently_selected)
manhattan_plot <- function(
  input, output, session,
  results_data,
  selected_codes,
  action_object ) {

  output$manhattanPlot <- plotly::renderPlotly({

    plot_data <- results_data %>%
      mutate(
        selected = ifelse(code %in% selected_codes(), 10, 3),
        id = 1:n()
      )

    plot_data %>%
      plotly::plot_ly(
        x = ~code,
        y = ~-log10(p_val),
        text = ~tooltip,
        key = ~id,
        type = 'scatter',
        mode = 'markers',
        hoverinfo = 'text',
        source = 'code_select',
        marker = list(
          color = plot_data$color,
          size = plot_data$selected,
          line = list(width = 0)
        )
      ) %>%
      plotly::config(displayModeBar = F) %>%
      plotly::layout(
        dragmode =  "select",
        xaxis = list(
          zeroline = FALSE,
          showline = FALSE,
          showticklabels = FALSE,
          showgrid = FALSE
        ),
        margin = list(
          r = 5,
          b = 0,
          t = 1
        )
      )
  })

  # Watch for manhattan plot code selection
  observe({
    selected_points <- plotly::event_data("plotly_selected", source = "code_select")
    req(selected_points)

    action_object_message <-  list(
      type = 'selection',
      payload = results_data[selected_points$key,]$code )

    action_object(action_object_message)
  })
}
