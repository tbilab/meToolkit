# testing main app module in own shiny app.
library(shiny)
library(readr)
# library(meToolkit)
devtools::load_all('../')

phewas_results <- readr::read_csv('data/phewas_results.csv')
id_to_snp <-      readr::read_csv('data/id_to_snp.csv')
id_to_phenome <-  readr::read_csv('data/id_to_phenome.csv')


my_ME_app <- build_me_app(
  phewas_results,
  id_to_snp,
  id_to_phenome,
  debug_mode = TRUE
)

shinyApp(my_ME_app$ui, my_ME_app$server)


# build_me_app(
#   snp_name        = 'rs13283456',
#   results_data    = read_rds(here::here('inst/demo_app/data/simulated_phewas_results.rds')) ,
#   individual_data = read_rds(here::here('inst/demo_app/data/simulated_ind_data.rds')),
#   run = TRUE
# )
