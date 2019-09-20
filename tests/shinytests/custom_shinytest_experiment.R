app <- ShinyDriver$new(here::here('inst/demo_app/'))


# Grabs a given element in app
app$findElement('.template-info-panel')$

# app$snapshotInit("custom_test")
# app$snapshot()
#
#
# vals <- app$getAllValues()
#
# info_panel_output <- vals$output$`main_app-info_panel_main_dashboard-info_banner_metoolkit` %>%
#   jsonlite::parse_json()
#
# info_panel_output$x$script <- 'js'
# info_panel_output$x$style <- 'css'

app$stop()
