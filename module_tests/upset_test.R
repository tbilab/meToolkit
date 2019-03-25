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
    h1('Upset module test'),
    tags$style(HTML("
      .my_upset {height: calc(85vh) !important;}
    ")),
    actionButton('toggle_snp', 'Toggle SNPs'),
    upset_UI('upsetPlot', div_class = 'my_upset')
  )
)

server <- function(input, output, session) {

  snp_filter <- reactiveVal(FALSE)

  observeEvent(input$toggle_snp,{
    snp_filter(!snp_filter())
  })

  upset_data <- reactive({
    data <- individual_data

    if(snp_filter()){
     return(data %>% filter(snp > 0))
    } else {
      return(data)
    }
  })

  upsetPlot <- callModule(upset, 'upsetPlot', upset_data, all_snp_data)

}

shinyApp(ui, server)
