#' UI function of phewas results table module
#'
#' @param id String with unique id of module in app
#' @return HTML component of shiny module
#' @export
#'
#' @examples
#' phewas_table_UI('my_mod')
phewas_table_UI <- function(id) {
  ns <- NS(id)
  shiny::tagList(
    DT::dataTableOutput(ns('selected_codes_list')),
    shiny::div(
      id = 'table_selection',
      shiny::span('Click on rows to unselect codes.'),
      shiny::actionButton(ns("filter_button"), "Update")
    )
  )
}

#' Server function of phewas results table module. Returns a reactive variable that dispenses interaction events in the common type, payload format of \code{meToolkit} modules.
#'
#' @param input,output,session Auto-filled by callModule | ignore
#' @param results_data Dataframe containing the results of the phewas study. Needs columns \code{p_val}, \code{id}, \code{category}(along with accompanying \code{color}), \code{tooltip}.
#' @param selected_codes A reactive variable containing array of code \code{id}s that are currently selected in the app.
#' @param action_object A \code{reactiveVal} that will be updated by the module upon selection
#' @return Shiny module that despenses type-payload actions to the \code{action_object} reactive
#' @export
#'
#' @examples
#' callModule(phewas_table, 'my_mod')
phewas_table <- function(
  input, output, session,
  results_data,
  selected_codes,
  action_object ) {

  # Reactive object containing the dataframe of just the currently shown codes
  displayed_codes <- reactive({
    results_data %>%
      filter(code %in% selected_codes()) %>%
      arrange(p_val) %>%
      select(-tooltip, -color)
  })

  # Datatable output
  output$selected_codes_list <- DT::renderDataTable({
    displayed_codes() %>%
      rename(`P-Value` = p_val) %>%
      DT::datatable(
        options = list(
          scrollY = 200,
          scroller = TRUE,
          dom = 't',
          order = list(list(3, 'asc')),
          pageLength = nrow(.)
        ),
        selection = list('multiple', selected = 1:nrow(.))
      )
  })

  # Observe the pressing of the filter button and send message back to the action element.
  observeEvent(input$filter_button, {

    codes_to_keep <- displayed_codes()$code[input$selected_codes_list_rows_selected]
    some_codes_deleted <- length(codes_to_keep) != nrow(displayed_codes())

    # Only submit the action if it's needed
    if(some_codes_deleted){
      action_object(list(
        type = 'selection',
        payload = codes_to_keep
      ))
    }
  })
}
