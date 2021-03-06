# testing main app module in own shiny app.
library(shiny)
library(readr)
library(meToolkit)

phewas_results <- readr::read_csv('data/phewas_results.csv')
id_to_snp <-      readr::read_csv('data/id_to_snp.csv')
id_to_phenome <-  readr::read_csv('data/id_to_phenome.csv')

my_ME_app <- build_me_dashboard(
  phewas_results,
  id_to_snp,
  id_to_phenome,
  snp_colors = c('#bdbdbd', '#fc9272', '#a50f15'),
  debug_mode = TRUE
)

shinyApp(my_ME_app$ui, my_ME_app$server)


# build_me_dashboard(
#   snp_name        = 'rs13283456',
#   results_data    = read_rds(here::here('inst/demo_app/data/simulated_phewas_results.rds')) ,
#   individual_data = read_rds(here::here('inst/demo_app/data/simulated_ind_data.rds')),
#   run = TRUE
# )
