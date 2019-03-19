library(shiny)
library(shinydashboard)


cached_data <- readr::read_rds(here::here('module_tests/data/infoboxes_data.rds'))

snp_name <- cached_data$snp_name
individual_data <- cached_data$individual_data

desired_codes <- colnames(individual_data)[-c(1, ncol(individual_data))] %>%
  sample(5)

curr_ind_data <- subsetToCodes(
  individual_data,
  desired_codes = desired_codes
)

ui <- shinyUI(
  tagList(
    h1('Info panel module test'),
    div(id = 'info_panel',
      info_panel_UI('info_panel')
    )
  )
)

server <- function(input, output, session) {
  callModule(
    info_panel, 'info_panel',
    snp_name,
    individual_data,
    reactive({curr_ind_data})
  )
}

shinyApp(ui, server)
