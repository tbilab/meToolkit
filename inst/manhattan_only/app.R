# testing main app module in own shiny app.
library(shiny)
library(readr)
# Run install_github("tbilab/meToolkit") to make sure you have the latest version
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

# Add category colors to data
cat_colors <- phewasHelper::category_colors()
phewas_results$color <- cat_colors[phewas_results$category]

selected_codes <- phewas_results %>%
  dplyr::filter(p_val < 0.01) %>%
  dplyr::pull(code)

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
colors <-  list(
  light_grey = "#f7f7f7",
  med_grey   = "#d9d9d9",
  light_blue = "#4292c6",
  green      = "#74c476"
)
r2d3::r2d3(
  data = phewas_results,
  script = system.file("d3/manhattan_plot/manhattan_plot.js", package = "meToolkit"),
  container = 'div',
  dependencies = c(
    "d3-jetpack",
    system.file("d3/helpers.js", package = "meToolkit"),
    system.file("d3/manhattan_plot/phewas_table.js", package = "meToolkit"),
    system.file("d3/manhattan_plot/clusterize.js", package = "meToolkit")
  ),
  css = c(
    system.file("d3/helpers.css", package = "meToolkit"),
    system.file("d3/manhattan_plot/manhattan_plot.css", package = "meToolkit"),
    system.file("css/common.css", package = "meToolkit")
  ),
  options = list(
    msg_loc = "standalone",
    selected = selected_codes,
    sig_bar_locs = "0.01",
    colors = colors,
    timestamp = 1
  )
)

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


  ## Manhattan plot
  shiny::callModule(
    meToolkit::manhattan_plot_and_table,
    'manhattan_plot_and_table',
    results_data = phewas_results,
    selected_codes = shiny::reactiveVal(selected_codes),
    colors = list(
      light_grey = "#f7f7f7",
      med_grey   = "#d9d9d9",
      light_blue = "#4292c6",
      green      = "#74c476"
    )
  )
}

shinyApp(app_ui, app_server)
