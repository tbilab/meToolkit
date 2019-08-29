# testing main app module in own shiny app.
library(meToolkit)
library(shiny)
library(shinydashboard)
library(shinydashboardPlus)
library(tidyverse)
library(magrittr)
library(here)
library(glue)

MAX_ALLOWED_CODES <- 45;

COLORS <- list(
  light_grey = "#f7f7f7",
  med_grey   = "#d9d9d9",
  dark_grey  = "#bdbdbd",
  light_red  = "#fcbba1",
  dark_red   = "#ef3b2c",
  light_blue = "#4292c6",
  green      = "#74c476"
)

NO_SNP_COLOR <- COLORS$dark_grey
ONE_SNP_COPY_COLOR <- COLORS$light_red
TWO_SNP_COPIES_COLOR <- COLORS$dark_red

# ===============================================================
# Load data
# ===============================================================
individual_data <- read_rds('data/simulated_ind_data.rds')
results_data    <- read_rds('data/simulated_phewas_results.rds')
snp_name        <- 'rs13283456'


ui <- htmlTemplate(
  here("inst/modular_demo_app/base_template.html"),
  app_content = main_dashboard_UI("main_app")
)


server <- function(input, output, session) {
  callModule(
    main_dashboard, 'main_app',
    snp_name = snp_name,
    results_data = results_data ,
    individual_data = individual_data,
    MAX_ALLOWED_CODES = 45,
    COLORS = COLORS
  )

}

shinyApp(ui, server)
