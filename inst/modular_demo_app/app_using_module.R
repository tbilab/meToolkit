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

usage_instructions <- div(
  h2('How To Use'),
  h3("Manhattan Plot"),
  p("Use the Manhattan plot to select your codes of interest by dragging a box on main plot or searching/selecting with the table."),
  p("Once you have your desired codes selected press 'Update Network' button at top of pane to update the network data with individuals possessing the selected codes."),
  h3("Upset Plot"),
  p("The upset plot allows you to see basic statistics about comorbidity patterns in the selected subset of codes, such as number of patients with a pattern and the risk of that pattern occuring in individuals with at least one copy of the minor allele."),
  p("Clicking on a given pattern in the upset plot will highlight the patients with that pattern in the below network plot."),
  h3("Network Plot"),
  p("The network plot provides a direct look at the individual-level data. You can click on codes to select them for isolation or deletion from the current selection.")
)

ui <- htmlTemplate(
  "template.html",
  app_title = 'Multimorbidity Explorer',
  manhattan_plot = manhattan_plot_and_table_UI(
    'manhattan_plot',
    div_class = 'manhattan_plot'
  ),
  upset = upset_UI(
    'upsetPlot',
    div_class = 'upset_plot'
  ),
  network =  network_plot_UI('network_plot',
                             height = '100%',
                             div_class = 'network_plot',
                             snp_colors = c(NO_SNP_COLOR, ONE_SNP_COPY_COLOR, TWO_SNP_COPIES_COLOR)
  ),
  info_panel = info_panel_UI('info_panel')
)


server <- function(input, output, session) {

}

shinyApp(ui, server)
