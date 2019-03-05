library(shiny)
library(shinydashboard)
library(magrittr)
library(tidyverse)

upsetData <- here::here('module_tests/data/upset_data.rds') %>%
  readr::read_rds()

individual_data <- upsetData$codeData
all_snp_data <- upsetData$snpData %>% select(IID, snp)


ui <- shinyUI(
  tagList(
    h1('Upset module test'),
    upset_UI('upsetPlot')
  )
)

server <- function(input, output, session) {

  upsetPlot <- callModule(upset, 'upsetPlot', reactive(individual_data), all_snp_data)

}

shinyApp(ui, server)

