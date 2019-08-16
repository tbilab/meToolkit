# testing main app module in own shiny app.
library(shiny)
library(shinydashboard)
library(shinydashboardPlus)
library(tidyverse)
library(magrittr)
library(here)
library(glue)


individual_data <- read_rds(here::here('../simulated_ind_data.rds'))
phewas_data     <- read_rds(here::here('../simulated_phewas_results.rds'))
snp_name        <- 'rs1234'


ui <- shinyUI(
  dashboardPage(
    dashboardHeader(
      title = "Multimorbidity Explorer",
      titleWidth = 300
    ),
    dashboardSidebar(disable = TRUE),
    dashboardBody(
      includeCSS(here("inst/css/main_dashboard.css")),
      main_dashboard_UI('main_app')
    ),
    skin = 'black'
  )
)

server <- function(input, output, session) {
  callModule(
    main_dashboard, "main_app",
    individual_data = individual_data,
    results_data = phewas_data,
    snp_name = snp_name
  )
}

shinyApp(ui, server)
