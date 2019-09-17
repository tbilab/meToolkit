app <- ShinyDriver$new("../../")
app$snapshotInit("mytest")

# Input '`main_app-manhattan_plot_main_dashboard-message_manhattan_plot_and_table`' was set, but doesn't have an input binding.
# Input '`main_app-network_plot_main_dashboard-message_network_plot`' was set, but doesn't have an input binding.
# Input '`main_app-upset_plot_main_dashboard-message_upset_plot`' was set, but doesn't have an input binding.
# Input '`main_app-upset_plot_main_dashboard-message_upset_plot`' was set, but doesn't have an input binding.
# Input '`main_app-upset_plot_main_dashboard-message_upset_plot`' was set, but doesn't have an input binding.
# Input '`main_app-upset_plot_main_dashboard-message_upset_plot`' was set, but doesn't have an input binding.
app$snapshot()
