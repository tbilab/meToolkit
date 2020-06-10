# testing main app module in own shiny app.
library(shiny)
library(readr)
library(meToolkit)

app_title <- "Just Manhattan Plot"
phewas_results <- readr::read_csv(here::here('inst/demo_app/data/phewas_results.csv'))
# > phewas_results
# # A tibble: 1,578 x 5
#     code   description                                         OR  p_val category
#     <chr>  <chr>                                            <dbl>  <dbl> <chr>
#   1 401.22 Hypertensive chronic kidney disease              0.733 0.337  circulatory system
#   2 401.30 Other hypertensive complications                 1.47  0.0588 circulatory system
#   3 411.00 Ischemic Heart Disease                           0.848 0.283  circulatory system

id_to_snp <-      readr::read_csv(here::here('inst/demo_app/data/id_to_snp.csv'))
# > id_to_snp
# # A tibble: 1,000 x 2
#     IID   rs123456
#     <chr>    <dbl>
#   1 r1           1
#   2 r10          0
#   3 r100         0
#   4 r1000        0

id_to_phenome <- readr::read_csv(here::here('inst/demo_app/data/id_to_phenome.csv'))
# > id_to_phenome
# # A tibble: 43,316 x 2
#     IID   code
#     <chr> <chr>
#   1 r1    008.00
#   2 r104  008.00
#   3 r145  008.00
#   4 r186  008.00
#   5 r188  008.00

# Setup data in the module-friendly combined format
data_for_shiny <- reconcile_data(phewas_results, id_to_snp, id_to_phenome, "none")
data_for_shiny$phewas_results <- data_for_shiny$phewas_results
cat_colors <- phewasHelper::category_colors()
data_for_shiny$phewas_results$color <- cat_colors[data_for_shiny$phewas_results$category]

styles <- "
  body {
    box-sizing: border-box;
    margin: 0 2px;
    background-color: #bdbdbd;
    --section-title-height: 2.3rem;
  }

  .title-bar {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #69696926;
    padding: 2px;
    margin-bottom: 2px;
    height: var(--section-title-height);
  }

  .app_holder{
    height: 100vh;
    width: 95vw;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
    background-color: white;
    box-shadow: 3px 3px 5px 0px rgba(0,0,0,0.49);
    border-radius: 4px;
    padding: 1.5rem;
    overflow: hidden;
  }

  #app_title {
    margin: 0 0 0.7rem 0px;
    padding: 0;
    border-bottom: 1px solid #080808;
    height: 40px;
  }

"
app_ui <- shiny::htmlTemplate(
  system.file("html_templates/empty_page.html", package = "meToolkit"),
  app_content = tagList(
    shiny::tags$style(styles),
    shiny::div(
      class = "app_holder",
      shiny::h1(app_title, id = "app_title"),
      meToolkit::manhattan_plot_and_table_UI('manhattan_plot_and_table'),
    )
  )
)

app_server <- function(input, output, session) {
  selected_codes <- data_for_shiny$phewas_results %>%
    dplyr::filter(p_val < 0.01) %>%
    dplyr::pull(code) %>%
    shiny::reactiveVal()

  ## Manhattan plot
  shiny::callModule(
    meToolkit::manhattan_plot_and_table,
    'manhattan_plot_and_table',
    results_data = data_for_shiny$phewas_results,
    selected_codes = selected_codes,
    colors = list(
      light_grey = "#f7f7f7",
      med_grey   = "#d9d9d9",
      light_blue = "#4292c6",
      green      = "#74c476"
    )
  )
}

shinyApp(app_ui, app_server)
