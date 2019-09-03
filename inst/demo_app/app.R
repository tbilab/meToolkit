# testing main app module in own shiny app.
library(shiny)
library(meToolkit)
library(readr)


my_ME_app <- build_me_app(
  snp_name        = 'rs13283456',
  results_data    = read_rds('data/simulated_phewas_results.rds') ,
  individual_data = read_rds('data/simulated_ind_data.rds')
)

shinyApp(my_ME_app$ui, my_ME_app$server)
