# testing main app module in own shiny app.
library(shiny)
library(here)
library(meToolkit)
library(readr)


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
  here("inst/html_templates/empty_page.html"),
  app_content = main_dashboard_UI("main_app")
)


server <- function(input, output, session) {
  callModule(
    main_dashboard, 'main_app',
    snp_name           = 'rs13283456',
    results_data       = read_rds('data/simulated_phewas_results.rds') ,
    individual_data    = read_rds('data/simulated_ind_data.rds'),
    MAX_ALLOWED_CODES  = 45,
    usage_instructions = usage_instructions
  )

}

shinyApp(ui, server)
