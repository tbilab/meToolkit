#' UI function of upset module
#'
#' @param id String with unique id of module in app
#' @return HTML component of shiny module
#' @export
#'
#' @examples
#' upset_UI('my_mod')
main_dashboard_UI <- function(id, div_class = 'upset_plot') {
  ns <- NS(id)
  tagList(
    htmlTemplate(
      system.file("demo_app/template.html", package = "meToolkit"),
      app_title = 'Multimorbidity Explorer',
      manhattan_plot = manhattan_plot_and_table_UI(
        ns('manhattan_plot'),
        div_class = 'manhattan_plot'
      ),
      upset = upset_UI(
        ns('upsetPlot'),
        div_class = 'upset_plot'
      ),
      network =  network_plot_UI(ns('network_plot'),
                                 height = '100%',
                                 div_class = 'network_plot',
                                 snp_colors = c(NO_SNP_COLOR, ONE_SNP_COPY_COLOR, TWO_SNP_COPIES_COLOR)
      ),
      info_panel = info_panel_UI(ns('info_panel'))
    )
  )
}
#' Server function of upset module
#'
#' @param input,output,session Auto-filled by callModule | ignore
#' @return Shiny module
#' @export
#'
#' @examples
#' main_dashboard(upset, 'my_mod')
main_dashboard <- function(
  input, output, session,
  snp_name,
  results_data,
  individual_data,
  MAX_ALLOWED_CODES,
  COLORS
 ) {


}
