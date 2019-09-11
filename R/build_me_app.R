#' Build ME app from data
#' Takes as input the three basic components of an ME app and either runs an ME app immediately or returns a list containing the ui and server parts of an entire app. This makes it easy to deploy a custom app with a few lines of code.
#' @param snp_name Character string containing the RSID of the snp you're viewing. Used to find annotation information.
#' @param results_data Dataframe containing the results of the phewas study. Needs columns \code{p_val}, \code{id}, \code{category}(along with accompanying \code{color}), \code{tooltip}.
#' @param individual_data Dataframe containing columns on \code{IID}, \code{snp}(# copies of allele), and columns for each code included.
#' @param max_allowed_codes How many codes can the app show at any given time. Defaults to 40. (Too many and app may get slow.)
#' @param run Do you want the app to run immediately or do you want the ui and server components of the app to run later? Defaults to `TRUE`.
#'
#' @return If `run = TRUE`, starts an ME app with your data, otherwise returns a list containing elements: `ui` for the shiny app ui function, and `server` for the server component of app.
#' @export
#'
#' @examples
#' my_ME_app <- build_me_app(
#'   snp_name        = 'rs13283456',
#'   results_data    = read_rds('data/simulated_phewas_results.rds') ,
#'   individual_data = read_rds('data/simulated_ind_data.rds')
#' )
#' shinyApp(my_ME_app$ui, my_ME_app$server)
build_me_app <- function(snp_name, results_data, individual_data, max_allowed_codes = 45, run = FALSE){

  app_ui <- shiny::htmlTemplate(
    system.file("html_templates/empty_page.html", package = "meToolkit"),
    app_content = meToolkit::main_dashboard_UI("main_app")
  )

  app_server <- function(input, output, session) {
    shiny::callModule(
      meToolkit::main_dashboard, 'main_app',
      snp_name           = snp_name,
      phewas_results     = results_data ,
      individual_data    = individual_data,
      max_allowed_codes  = max_allowed_codes
    )
  }

  if(run){
    shiny::shinyApp(app_ui, app_server)
  } else {
    list(
      ui = app_ui,
      server = app_server
    )
  }
}
