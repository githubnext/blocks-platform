import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error, errorInfo) {}

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="flex flex-col">
          <h1>Something went wrong.</h1>
          <p>
            {/* @ts-ignore */}
            {this.state.errorMessage || ""}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
