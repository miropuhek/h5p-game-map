/**
 * Mixin containing methods for H5P Question Type contract.
 */
export default class QuestionTypeContract {
  /**
   * Determine whether the task was answered already.
   *
   * @returns {boolean} True if answer was given by user, else false.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
   */
  getAnswerGiven() {
    return this.content.getAnswerGiven();
  }

  /**
   * Get current score.
   *
   * @returns {number} Current score.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
   */
  getScore() {
    return this.content.getScore();
  }

  /**
   * Get maximum possible score.
   *
   * @returns {number} Maximum possible score.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
   */
  getMaxScore() {
    return this.content.getMaxScore();
  }

  /**
   * Show solutions.
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
   */
  showSolutions() {
    this.content.showSolutions();
  }

  /**
   * Reset task.
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
   */
  resetTask() {
    this.content.reset();
    this.content.start();
  }

  /**
   * Get xAPI data.
   *
   * @returns {object} XAPI statement.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  getXAPIData() {
    const xAPIEvent = this.createXAPIEvent('completed');

    // Not a valid xAPI value (!), but H5P uses it for reporting
    xAPIEvent.data.statement.object.definition.interactionType = 'compound';

    return {
      statement: xAPIEvent.data.statement,
      children: this.content.getXAPIData()
    };
  }

  /**
   * Get context data.
   * Contract used for confusion report.
   *
   * @returns {object} Context data.
   */
  getContext() {
    return this.content.getContext();
  }
}