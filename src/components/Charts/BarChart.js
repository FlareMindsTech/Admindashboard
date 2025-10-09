import React, { Component } from "react";
import Chart from "react-apexcharts";

class BarChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chartData: props.chartData || [],
      chartOptions: props.chartOptions || { xaxis: { categories: [] } },
    };
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.chartData !== this.props.chartData ||
      prevProps.chartOptions !== this.props.chartOptions
    ) {
      this.setState({
        chartData: this.props.chartData || [],
        chartOptions: this.props.chartOptions || { xaxis: { categories: [] } },
      });
    }
  }

  render() {
    return (
      <Chart
        options={this.state.chartOptions}
        series={this.state.chartData}
        type="bar"
        width="100%"
        height="100%"
      />
    );
  }
}

export default BarChart;
