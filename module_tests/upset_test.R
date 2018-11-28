library(shiny)
library(shinydashboard)
library(magrittr)

upsetData <- here::here('module_tests/data/upset_data.rds') %>%
  readr::read_rds()

codeData <- upsetData$codeData
snpData <- upsetData$snpData

currentSnp <- 'rs5908'


ui <- shinyUI(
  dashboardPage(
    dashboardHeader(
      title = "Multimorbidity Explorer",
      titleWidth = 300
    ),
    dashboardSidebar(disable = TRUE),
    dashboardBody(
      includeCSS(here::here("module_tests/custom.css")),
      checkboxInput(
        "snp_filter",
        label = "Just minor-allele carriers",
        value = FALSE
      ),
      meToolkit::upset_UI('upsetPlotV2', size_max = 750)
    ),
    skin = 'black'
  )
)


server <- function(input, output, session) {
  observe({

    codeFiltered <- codeData %>% {
      this <- .

      if(input$snp_filter) this <- this %>% dplyr::filter(snp > 0)

      this
    }

    print('running module!')

    callModule(meToolkit::upset, 'upsetPlotV2',
               codeData = codeFiltered,
               snpData = snpData)
  })

}

shinyApp(ui, server)
