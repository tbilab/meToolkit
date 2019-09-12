#' Build ME app from data
#'
#' Takes as input the three basic components of an ME app
#' and either runs an ME app immediately or returns a list containing the ui and
#' server parts of an entire app. This makes it easy to deploy a custom app with
#' a few lines of code.
#'
#' @inheritParams reconcile_data
#' @param max_allowed_codes How many codes can the app show at any given time.
#'   Defaults to 40. (Too many and app may get slow.)
#' @param auto_run Do you want the app to run immediately or do you want the ui and
#'   server components of the app to run later? Defaults to `TRUE`.
#'
#' @return If `auto_run = TRUE`, starts an ME app with your data, otherwise returns a
#'   list containing elements: `ui` for the shiny app ui function, and `server`
#'   for the server component of app.
#' @export
#'
#' @examples
#' my_ME_app <- build_me_app(
#'   phewas_table,
#'   id_to_snp,
#'   phenotype_id_pairs
#' )
#' shinyApp(my_ME_app$ui, my_ME_app$server)
build_me_app <- function(phewas_results, genotypes, phenotypes, max_allowed_codes = 45, auto_run = FALSE){

  # Setup data in the module-friendly combined format
  data_for_shiny <- reconcile_data(phewas_results, genotypes, phenotypes)

  app_ui <- shiny::htmlTemplate(
    system.file("html_templates/empty_page.html", package = "meToolkit"),
    app_content = meToolkit::main_dashboard_UI("main_app")
  )

  app_server <- function(input, output, session) {
    shiny::callModule(
      meToolkit::main_dashboard, 'main_app',
      snp_name           = data_for_shiny$snp_name,
      phewas_results     = data_for_shiny$phewas_results,
      individual_data    = data_for_shiny$individual_data,
      max_allowed_codes  = max_allowed_codes
    )
  }

  if(auto_run){
    shiny::shinyApp(app_ui, app_server)
  } else {
    list(
      ui = app_ui,
      server = app_server
    )
  }
}
