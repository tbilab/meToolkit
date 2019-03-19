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
  tagList(

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
phewas_table <- function(input, output, session) {

}
