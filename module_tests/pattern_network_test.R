library(shiny)
library(shinydashboard)
library(magrittr)
library(tidyverse)
library(meToolkit)

upsetData <- here::here('module_tests/data/upset_data.rds') %>%
  readr::read_rds()

individual_data <- upsetData$codeData
all_snp_data <- upsetData$snpData %>% select(IID, snp)

ui <- shinyUI(
  tagList(
    h1('pattern_network module test'),
    tags$style(HTML("
      .my_pattern_network {height: calc(85vh) !important;}
    ")),
    actionButton('toggle_snp', 'Toggle SNPs'),
    pattern_network_UI('pattern_networkPlot', div_class = 'my_pattern_network')
  )
)

server <- function(input, output, session) {

  snp_filter <- reactiveVal(FALSE)
  action_object <- reactiveVal()

  pattern_network_data <- reactive({
    data <- individual_data

    if(snp_filter()){
     return(data %>% filter(snp > 0))
    } else {
      return(data)
    }
  })

  observeEvent(input$toggle_snp,{
    snp_filter(!snp_filter())
  })

  observeEvent(action_object(),{
    print("we have a message from the plot!")
    print(action_object()$payload)
  })

  pattern_networkPlot <- callModule(
    pattern_network, 'pattern_networkPlot',
    pattern_network_data,
    all_snp_data,
    action_object )

}

shinyApp(ui, server)
