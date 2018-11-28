library(shiny)
library(shinydashboard)

# source(here::here('R/infopanel_module.R'))

cached_data <- readr::read_rds(here::here('module_tests/data/infoboxes_data.rds'))

snp_name <- cached_data$snp_name
individual_data <- cached_data$individual_data
subset_maf <- 0.4


ui <- shinyUI(
  dashboardPage(
    dashboardHeader(
      title = "Multimorbidity Explorer",
      titleWidth = 300
    ),
    dashboardSidebar(
      h2('Settings'),
      sliderInput("setSize", "Min Size of Set:",
                  min = 0, max = 250,
                  value = 20),
      collapsed = TRUE
    ),
    dashboardBody(
      includeCSS(here::here("module_tests/custom.css")),
      meToolkit::infoPanel_UI('info_panel', I)
    ),
    skin = 'black'
  )
)

server <- function(input, output, session) {
  callModule(meToolkit::infoPanel, 'info_panel', snp_name, individual_data, subset_maf)
}

shinyApp(ui, server)
