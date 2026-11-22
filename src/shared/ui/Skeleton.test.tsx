import { render } from '@testing-library/react'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('is hidden from assistive technology and carries no inline style', () => {
    const { container } = render(<Skeleton height="title" width={40} />)
    const element = container.firstElementChild as HTMLElement

    expect(element).toHaveAttribute('aria-hidden', 'true')
    expect(element).not.toHaveAttribute('style')
  })
})
